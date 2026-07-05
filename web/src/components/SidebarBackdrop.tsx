import { useNavigationContext } from '../context/AppContext';
import './Sidebar.css';

export function SidebarBackdrop() {
  const { sidebarOpen, closeSidebar } = useNavigationContext();
  return (
    <div
      className={`sidebar-backdrop${sidebarOpen ? ' show' : ''}`}
      onClick={closeSidebar}
      aria-hidden={!sidebarOpen}
    />
  );
}
