import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default async function HomePage() {
  const auth = await isAuthenticated();
  if (auth) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
