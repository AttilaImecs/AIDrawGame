const { Engine, World, Bodies, Events, Vertices } = Matter;

export function createWorld() {
  const engine = Engine.create();
  engine.gravity.y = 1;
  return engine;
}

export function addPlatform(engine, { x, y, width, height, angle = 0 }) {
  const body = Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    angle: (angle * Math.PI) / 180,
    friction: 0.9,
    label: 'platform',
  });
  World.add(engine.world, body);
  return body;
}

export function addEgg(engine, { x, y, width, height }) {
  const radius = (width + height) / 4;
  const body = Bodies.circle(x, y, radius, {
    friction: 0.6,
    frictionAir: 0.01,
    restitution: 0.2,
    density: 0.002,
    label: 'egg',
  });
  World.add(engine.world, body);
  return body;
}

// Solid, not a sensor: it doubles as the world's floor so nothing falls forever
// if it misses the platform. Egg-vs-water is still detected via the normal
// 'collisionStart' event that solid bodies fire on contact.
export function addWater(engine, { x, y, width, height }) {
  const body = Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    friction: 0.4,
    label: 'water',
  });
  World.add(engine.world, body);
  return body;
}

// `hullPoints` must already be a convex hull (see computeHull) in canvas coordinates.
// Returns { body, centre } - `centre` is the point the body rotates/renders around,
// needed by the caller to express the original drawn stroke in the body's local space.
export function addDrawnBody(engine, hullPoints, thickness) {
  const inflated = inflateHull(hullPoints, thickness / 2);
  const centre = Vertices.centre(inflated);
  const body = Bodies.fromVertices(centre.x, centre.y, [inflated], {
    friction: 0.7,
    frictionAir: 0.008,
    restitution: 0.15,
    density: 0.012,
    label: 'drawn',
  });
  World.add(engine.world, body);
  return { body, centre };
}

export function computeHull(points) {
  return Vertices.hull(points.map((p) => ({ x: p.x, y: p.y })));
}

function inflateHull(hull, amount) {
  const centre = Vertices.centre(hull);
  return hull.map((p) => {
    const dx = p.x - centre.x;
    const dy = p.y - centre.y;
    const dist = Math.hypot(dx, dy) || 1;
    return {
      x: p.x + (dx / dist) * amount,
      y: p.y + (dy / dist) * amount,
    };
  });
}

export function removeBody(engine, body) {
  World.remove(engine.world, body);
}

export function step(engine, dt) {
  Engine.update(engine, dt * 1000);
}

export function onCollisionStart(engine, callback) {
  Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      callback(pair.bodyA, pair.bodyB);
    }
  });
}
