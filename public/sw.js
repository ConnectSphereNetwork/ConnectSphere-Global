// This event listener is triggered when a push notification is received
self.addEventListener('push', event => {
  const data = event.data.json(); // Parse the data from the server

  const options = {
    body: data.body,
    icon: '/icon-192x192.png', // You can add an icon for your app here
    badge: '/badge-72x72.png', // A smaller icon for the notification bar
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// This event listener is triggered when a user clicks on the notification
self.addEventListener('notificationclick', event => {
  event.notification.close(); // Close the notification

  // Open the website when the notification is clicked
  event.waitUntil(
    clients.openWindow('/')
  );
});