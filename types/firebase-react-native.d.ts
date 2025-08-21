declare module "firebase/auth/react-native" {
  export * from "firebase/auth";
  export function getReactNativePersistence(storage: any): any;
}
