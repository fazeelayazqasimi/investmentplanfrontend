import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading...', size = 20 }) {
  return (
    <div className="center-spinner">
      <Loader2 size={size} className="spin" />
      <span>{label}</span>
    </div>
  );
}
