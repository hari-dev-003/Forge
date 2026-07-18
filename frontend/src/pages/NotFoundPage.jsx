import { Link } from 'react-router-dom';
import { Button } from '../components/ui/index.jsx';

export default function NotFoundPage() {
  return (
    <div className="grid place-items-center min-h-screen text-center gap-4">
      <div>
        <h1 className="text-[64px] text-primary font-bold">404</h1>
        <p className="text-muted mb-5">This page doesn't exist.</p>
        <Link to="/"><Button>Back to dashboard</Button></Link>
      </div>
    </div>
  );
}
