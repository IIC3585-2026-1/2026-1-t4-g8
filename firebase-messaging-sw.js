importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");                                                                                                                                
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");                                                                                                                          
                                                                                                                                                                                                                     
firebase.initializeApp({                                                                                                                                                                                           
    apiKey: "AIzaSyAviqTv7Y5d5ls5mhYLfKzBmaTRhLwnoZM",                                                                                                                                                               
    projectId: "bangod-23921",                                                                                                                                                                                       
    messagingSenderId: "887389282586",                                                                                                                                                                               
    appId: "1:887389282586:web:98d23f755658a921720ca3"                                                                                                                                                               
  });                                                                                                                                                                                                                
                                                                                                                                                                                                                     
firebase.messaging();                                                                                                                                                                                              
                  
self.addEventListener('push', (event) => {
    console.log('SW push event:', event);
    let payload = {};                                                                                                                                                                                                
    try { payload = event.data?.json() ?? {}; } catch (e) { payload = {}; }
    console.log('SW payload:', payload);                                                                                                                                                                             
                    
    const n = payload.notification ?? payload.data ?? {};                                                                                                                                                            
    const title = n.title ?? 'Notificación';
    const body  = n.body  ?? '';                                                                                                                                                                                     
                
    event.waitUntil(self.registration.showNotification(title, { body }));                                                                                                                                            
});