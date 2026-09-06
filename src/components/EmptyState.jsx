import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No data', subtitle, icon: Icon, children }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {Icon ? <Icon size={28} /> : <Inbox size={28} />}
      </div>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </div>
  );
}
