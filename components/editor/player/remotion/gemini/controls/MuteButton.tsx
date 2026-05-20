import type {PlayerRef} from '@remotion/player';
import React, {useEffect, useState} from 'react';

//icons
import {Volume2, VolumeX} from 'lucide-react';

export const MuteButton: React.FC<{
  playerRef: React.RefObject<PlayerRef | null>;
}> = ({playerRef}) => {
  const [muted, setMuted] = useState(playerRef.current?.isMuted() ?? false);

  const onClick = React.useCallback(() => {
    if (!playerRef.current) {
      return;
    }

    if (playerRef.current.isMuted()) {
      playerRef.current.unmute();
    } else {
      playerRef.current.mute();
    }
  }, [playerRef]);

  useEffect(() => {
    const {current} = playerRef;
    if (!current) {
      return;
    }

    const onMuteChange = () => {
      setMuted(current.isMuted());
    };

    current.addEventListener('mutechange', onMuteChange);
    return () => {
      current.removeEventListener('mutechange', onMuteChange);
    };
  }, [playerRef]);

  return (
    <button type="button" onClick={onClick}>
      {muted ? <VolumeX /> : <Volume2 />}
    </button>
  );
};