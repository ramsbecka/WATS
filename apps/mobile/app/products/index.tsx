import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function ProductsIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/products');
  }, []);
  return null;