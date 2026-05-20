import React from 'react';

//icons
import {Repeat, X} from 'lucide-react';

export const LoopButton: React.FC<{
  loop: boolean;
  setLoop: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({loop, setLoop}) => {
  const onClick = React.useCallback(() => {
    setLoop((prev) => !prev);
  }, [setLoop]);

  return (
    <button type="button" onClick={onClick}>
      {loop ? <Repeat /> : <X />}
    </button>
  );
};