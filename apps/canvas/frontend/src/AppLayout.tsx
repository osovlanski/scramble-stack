import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';

export default function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 h-full overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
