import WebApp from '@twa-dev/sdk';
import { Button } from '../../components/ui/Button';

export function Profile() {
  const user = WebApp.initDataUnsafe?.user;

  return (
    <div className="p-4 flex flex-col items-center">
      <div className="w-24 h-24 bg-tg-button rounded-full flex items-center justify-center text-3xl text-white font-bold mb-4 mt-8">
        {user?.first_name?.[0] || 'U'}
      </div>
      <h2 className="text-xl font-bold">{user?.first_name} {user?.last_name}</h2>
      {user?.username && <p className="text-tg-hint">@{user.username}</p>}

      <div className="w-full mt-8 space-y-3">
        <Button variant="secondary" className="w-full justify-start" onClick={() => WebApp.openTelegramLink('https://t.me/support')}>
           Contact Support
        </Button>
        <Button variant="secondary" className="w-full justify-start" onClick={() => WebApp.close()}>
           Close Mini App
        </Button>
      </div>
    </div>
  );
}
