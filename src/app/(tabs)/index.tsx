import { Redirect } from 'expo-router';
import { useAuth } from '../../components/AuthProvider';

export default function IndexRouter() {
  const { user } = useAuth();

  if (user?.persona === 'b2c_user') {
    return <Redirect href="/(tabs)/dashboard" />;
  }
  
  if (user?.persona === 'b2b_autism_user') {
    return <Redirect href="/(tabs)/autism-home" />;
  }

  if (user?.persona === 'b2b_educator') {
    return <Redirect href="/(tabs)/enterprise" />;
  }

  // Fallback
  return <Redirect href="/(tabs)/dashboard" />;
}
