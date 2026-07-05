import { Sidebar } from './Sidebar';
import { SidebarBackdrop } from './SidebarBackdrop';
import { MainPanel } from './MainPanel';
import { DetailModal } from './DetailModal';

export function Layout() {
  return (
    <div className="app">
      <SidebarBackdrop />
      <Sidebar />
      <MainPanel />
      <DetailModal />
    </div>
  );
}
