import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to auth by default - Auto workflow test
  return <Redirect href="/auth" />;
}