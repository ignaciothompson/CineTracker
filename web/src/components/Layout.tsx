import { Sidebar } from './Sidebar';
import { SidebarBackdrop } from './SidebarBackdrop';
import { MainPanel } from './MainPanel';
import { DetailView } from './DetailView';

export function Layout() {
  return (
    <div className="app">
      <SidebarBackdrop />
      <Sidebar />
      <MainPanel />
      <DetailView />
    </div>
  );
}
