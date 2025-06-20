// Utility to get user's current geolocation as [lng, lat]
export function getCurrentLocation(): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([
            position.coords.longitude,
            position.coords.latitude,
          ]);
        },
        (error) => reject(error)
      );
    }
  });
}
