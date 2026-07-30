const { Engine, World, Bodies, Body, Constraint, Events, Vertices } = Matter;

export function createWorld() {
  const engine = Engine.create();
  engine.gravity.y = 1;
  return engine;
}

// Friction is deliberately low: even a shallow ~12 degree ramp needs
// friction well under tan(12 deg)~=0.21 or a sliding/rolling body just
// decelerates to a stop almost immediately (verified empirically - at 0.7-0.9
// nothing ever made it past the first egg on a staircase level). The spec
// explicitly allows the dropped shape to slide OR roll down a slant, so low
// friction here is correct, not just a workaround.
//
// frictionStatic also has to be lowered explicitly. Matter defaults it to
// 0.5 regardless of `friction`, and it's what governs a body once its
// tangential sliding speed drops near zero - so even with friction:0.12, a
// slowly-rolling body would hit that much higher static threshold (0.5 >>
// tan(12deg)) and lock in place dead on the slope. This was the actual cause
// of objects consistently stopping ~40px before ever reaching the stopper
// peg, well short of tan(angle) predicting they should keep sliding.
const LOW_STATIC_FRICTION = 0.05;

// Stopper pegs exist purely to pin an egg in place on a slope (see
// addEgg/level data) - they were never meant to be real obstacles for the
// player's dropped shape. But a stopper is solid geometry like any other
// platform, and the drawn body is much larger than the peg itself (its own
// ~50px radius vs. the peg's ~14px width), so it was making contact with -
// and getting fully blocked by - the same peg meant only to catch the egg.
// Collision categories fix this cleanly: stoppers collide with eggs (and
// stay solid-looking platforms visually) but the drawn body's mask excludes
// them, so it passes straight through.
const CATEGORY_DEFAULT = 0x0001;
const CATEGORY_STOPPER = 0x0002;
const CATEGORY_DRAWN = 0x0004;

export function addPlatform(engine, { x, y, width, height, angle = 0, isStopper = false }) {
  const body = Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    angle: (angle * Math.PI) / 180,
    friction: 0.12,
    frictionStatic: LOW_STATIC_FRICTION,
    label: 'platform',
    collisionFilter: isStopper
      ? { category: CATEGORY_STOPPER, mask: 0xffffffff & ~CATEGORY_DRAWN }
      : { category: CATEGORY_DEFAULT, mask: 0xffffffff },
  });
  World.add(engine.world, body);
  return body;
}

export function addEgg(engine, { x, y, width, height }) {
  const radius = (width + height) / 4;
  const body = Bodies.circle(x, y, radius, {
    friction: 0.3,
    frictionStatic: LOW_STATIC_FRICTION,
    frictionAir: 0.01,
    restitution: 0.2,
    density: 0.002,
    label: 'egg',
  });
  World.add(engine.world, body);
  return body;
}

// Invisible walls just outside the left/right canvas edges. Without these,
// anything that comes to rest on the water's surface with any residual
// sideways velocity (e.g. after a long roll down a slope) can slide past
// x=0 or x=DESIGN_WIDTH - water is exactly canvas-width, nothing bounds it
// horizontally - and then just falls forever into empty space below the
// world with nothing left to collide with. Observed happening for real
// during "The Gauntlet" testing (object drifted off the left edge at
// y~830 and free-fell past y=2700 with no world bounds to catch it).
export function addWorldBounds(engine, width, height) {
  const thickness = 40;
  const left = Bodies.rectangle(-thickness / 2, height / 2, thickness, height * 3, {
    isStatic: true,
    friction: 0,
    label: 'platform',
  });
  const right = Bodies.rectangle(width + thickness / 2, height / 2, thickness, height * 3, {
    isStatic: true,
    friction: 0,
    label: 'platform',
  });
  World.add(engine.world, [left, right]);
  return [left, right];
}

// Solid, not a sensor: it doubles as the world's floor so nothing falls forever
// if it misses the platform. Egg-vs-water is still detected via the normal
// 'collisionStart' event that solid bodies fire on contact.
export function addWater(engine, { x, y, width, height }) {
  const body = Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    friction: 0.4,
    frictionStatic: LOW_STATIC_FRICTION,
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
    friction: 0.12,
    frictionStatic: LOW_STATIC_FRICTION,
    frictionAir: 0.008,
    restitution: 0.25,
    density: 0.012,
    label: 'drawn',
    collisionFilter: { category: CATEGORY_DRAWN, mask: 0xffffffff & ~CATEGORY_STOPPER },
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

// A real pendulum: a dynamic plank on a rigid rod from a fixed pivot point,
// released from (x, y) and left to swing under gravity. Its own rotational
// inertia is set to Infinity so it can't spin - it translates along the arc
// but stays level, like a gondola. This is deliberately NOT a kinematically
// scripted (manually-repositioned) body: an earlier version drove a static
// body's position/velocity by hand each frame to fake the same motion, but
// bodies resting on it (via friction) picked up a small extra push every
// step from that approach and the error compounded into a runaway energy
// injection after a few swing cycles. Using a genuine Matter constraint
// keeps everything - the swing's own motion AND its contact with anything
// resting on top - inside Matter's normal, self-consistent integration.
export function addSwingPlatform(engine, { pivotX, pivotY, x, y, width, height }) {
  const body = Bodies.rectangle(x, y, width, height, {
    friction: 0.9,
    frictionAir: 0.001,
    label: 'platform',
  });
  Body.setInertia(body, Infinity);
  const constraint = Constraint.create({
    pointA: { x: pivotX, y: pivotY },
    bodyB: body,
    length: Math.hypot(x - pivotX, y - pivotY),
    stiffness: 1,
  });
  World.add(engine.world, [body, constraint]);
  return body;
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
