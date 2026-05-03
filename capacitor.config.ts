import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meal.app',
  appName: '今天吃什么',
  webDir: 'public',
  server: {
    url: 'https://meal-app.onrender.com',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#e74c3c',
      showSpinner: false
    }
  }
};

export default config;
