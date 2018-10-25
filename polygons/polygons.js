;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory()
    : typeof define === 'function' && define.amd ? define(factory) : global.polygons = factory() // eslint-disable-line
}(this, function () {
  'use strict'

  // Tools for doing linear algebra
  const linal = {
    // The normal of a plane in points a, b and c.
    normal: (a, b, c) => linal.cross(a.map((e, i) => b[i] - e), a.map((e, i) => c[i] - e)).map((e, i) => a[i] + e),
    // The cross product of vectors a and b
    cross: (a, b) => [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ],
    // The dot product of vectors a and b
    dot: (a, b) => a.reduce((acc, cur, i) => acc + cur * b[i], 0) / (linal.distance(a) * linal.distance(b)),
    // The euclidean distance between vector a and b (b defaults to origin)
    distance: (a, b) => Math.sqrt(a.reduce((acc, cur, i) => acc + Math.pow(cur - (b ? b[i] : 0), 2), 0)),
    // A transformation of vector a by transformation matrix m
    transform: (a, m) => m.map(row => row.reduce((acc, cur, i) => acc + cur * a[i], 0)),
    // A rotation of vector a by r applied in order r[0] (x), r[1] (y) and last r[2] (z).
    rotate: (a, r) => [
      [ [1, 0, 0], [0, Math.cos(r[0]), -Math.sin(r[0])], [0, Math.sin(r[0]), Math.cos(r[0])] ],
      [ [Math.cos(r[1]), 0, Math.sin(r[1])], [0, 1, 0], [-Math.sin(r[1]), 0, Math.cos(r[1])] ],
      [ [Math.cos(r[2]), -Math.sin(r[2]), 0], [Math.sin(r[2]), Math.cos(r[2]), 0], [0, 0, 1] ],
    ].reduce((acc, cur) => linal.transform(acc, cur), a),
  }

  // Functions that transform an iterable of polygons
  const transforms = {
    // Move vectors by offset
    transpose: offset => polygons => polygons.forEach(polygon => polygon.vectors = polygon.vectors.map(
      vector => vector.map((e, i) => e + offset[i])
    )),
    // Rotate vectors around center by rotation array with radians for x, y and z.
    rotate: (rotation, center) => polygons => polygons.forEach(polygon => polygon.vectors = polygon.vectors.map(
      vector => linal.rotate(vector.map((e, i) => e - center[i]), rotation).map((e, i) => e + center[i])
    )),
    // Scale vectors by three dimensional scaling factor scale
    scale: scale => polygons => polygons.forEach(polygon => polygon.vectors = polygon.vectors.map(
      vector => vector.map((e, i) => e * scale[i])
    )),
    // Darken the color on surfaces as it deviates from a light source
    shading: (source, intensity, observer) => polygons => polygons.forEach(polygon => {
      let normal = linal.normal(polygon.vectors[0], polygon.vectors[1], polygon.vectors[2])
      var dot = linal.dot(normal, source)
      // If surface isn't facing observer, flip it.
      if (Math.acos(linal.dot(normal, observer.map((e, i) => polygon.vectors[0][i] - e))) < Math.PI / 2) dot = -dot
      polygon.color = polygon._color.map(c => Math.round(c - 2 * intensity * Math.acos(dot) / Math.PI))
    }),
    // Sort polygons by distance to observer (closest to observer appears last)
    zsort: observer => polygons => {
      polygons.sort((a, b) => {
        // Return the sum of the difference in distance from observer between vectors in polygon a and b
        // Why does this work? Who knows.
        let distances = [a, b].map(p => p.vectors.map(vector => linal.distance(vector, observer)))
        return distances[0].reduce((acc, cur, i) => acc + distances[1][i] - cur, 0)
      })
    },
    // Center the cluster in origin
    center: location => polygons => {
      location = location || [0, 0, 0]
      let smallest = polygons[0].vectors[0].slice()
      let largest = polygons[0].vectors[0].slice()
      let match = (vectors) => vectors.forEach(vector => vector.forEach((e, i) => {
            smallest[i] = Math.min(smallest[i], e)
            largest[i] = Math.max(largest[i], e) }))
      polygons.forEach(polygon => match(polygon.vectors))
      let offset = smallest.map((e, i) => location[i] - (e + (largest[i] - e) / 2))
      transforms.transpose(offset)(polygons)
    },
    // Bundle several transforms into one
    bundle: transforms => polygons => {
      transforms.forEach(entry => {
        if (entry[1]) {
          entry[0](polygons.filter(entry[1]))
        } else {
          entry[0](polygons)
        }
      })
    },
  }

  // Templates take an arbitrary number of arguments and create a set of polygons
  const templates = {
    cuboid: (position, size, name, color) => target => {
      // A corner of the cuboid is described with three binary digits (e.g. '101')
      // A zero ('0') means that the corner share location with vector `position` in the axis, so corner '000' is at
      // the same location as `position`.
      // A one ('1') means that the corner is displaced by `size` in the axis, so corner '001' is adjacent to corner
      // '000' and displaced on the z-axis by size[2], while corner '111' is displaced in all axis and hence diagonally
      // opposed to '000'.
      // Each side on a cuboid consist of four corners. The array below describes the three sides of the cuboid that
      // has a corner in '000', the other three sides are identical to these sides inverted, so they'll be derived.
      let c0 = [
        ['000', '100', '110', '010'],
        ['000', '010', '011', '001'],
        ['000', '001', '101', '100'] ]
      // For the three sides of the cuboid defined above and their invertions, calculate the position of the corners
      // one side at the time and add each side as a polygon.
      let add = vectors => target(vectors, name, color);
      ['1', '0'].forEach(h => c0.map(s => s.map(c => position.map((p, i) => p + (c[i] === h) * size[i]))).forEach(add))
    },
  }

  // Contract for transforms
  function Polygon (vectors, name, color) {
    this.vectors = vectors
    this.name = name
    this._color = this.color = color || [255, 255, 255] // Underscore is for read only
  }

  // Represents the polygon cluster.
  function Cluster () {
    const _polygons = []

    this.add = (...args) => {
      _polygons.push(new Polygon(...args))
    }

    this.apply = (transform, filter) => {
      transform(filter ? _polygons.filter(filter) : _polygons)
      return this
    }

    this.zsort = (observer, filter) => {
      return this.apply(transforms.zsort(observer), filter)
    }

    this.center = (location, filter) => {
      return this.apply(transforms.center(location), filter)
    }

    this.scale = (scale, filter) => {
      return this.apply(transforms.scale(scale), filter)
    }

    this.transpose = (offset, filter) => {
      return this.apply(transforms.transpose(offset), filter)
    }

    this.shading = (source, intensity, observer, filter) => {
      return this.apply(transforms.shading(source, intensity, observer), filter)
    }

    this.rotate = (rotation, center, filter) => {
      return this.apply(transforms.rotate(rotation, center), filter)
    }
  }

  let _constr = () => new Cluster()
  _constr.transforms = transforms
  _constr.templates = templates
  _constr._Cluster = Cluster
  _constr._Polygon = Polygon
  _constr._linal = linal

  return _constr
}))