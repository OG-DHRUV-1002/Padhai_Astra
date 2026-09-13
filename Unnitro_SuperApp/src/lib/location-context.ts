const dummyLocation = { x: 0, y: 0, z: 0, buildingId: 'b1' };
const dummyUpdate = () => {};

export function useLocation() {
  return { location: dummyLocation, updateLocation: dummyUpdate };
}
