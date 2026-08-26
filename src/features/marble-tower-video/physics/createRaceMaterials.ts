import * as CANNON from "cannon-es";

export function createRaceMaterials(world: CANNON.World) {
  const marble = new CANNON.Material("marble");
  const track = new CANNON.Material("track");
  const obstacle = new CANNON.Material("obstacle");
  const chime = new CANNON.Material("chime");
  const piano = new CANNON.Material("piano");

  world.addContactMaterial(new CANNON.ContactMaterial(marble, track, {
    friction: 0.022,
    restitution: 0.08,
    contactEquationStiffness: 1e8,
  }));
  world.addContactMaterial(new CANNON.ContactMaterial(marble, obstacle, {
    friction: 0.04,
    restitution: 0.62,
  }));
  world.addContactMaterial(new CANNON.ContactMaterial(marble, marble, {
    friction: 0.018,
    restitution: 0.58,
  }));
  world.addContactMaterial(new CANNON.ContactMaterial(marble, chime, {
    friction: 0.035,
    restitution: 0.24,
  }));
  world.addContactMaterial(new CANNON.ContactMaterial(marble, piano, {
    friction: 0.045,
    restitution: 0.04,
  }));

  return { marble, track, obstacle, chime, piano };
}
