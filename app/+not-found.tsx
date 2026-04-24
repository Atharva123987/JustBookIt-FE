import { Redirect } from 'expo-router';

export default function NotFound() {
    console.log("Redirecting to home page...")
  return <Redirect href="/" />;
}