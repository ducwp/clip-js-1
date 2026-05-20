import React from 'react';
import { Sequence } from 'remotion';
import { SelectionOutline } from './SelectionOutline';
import type { Item } from './item';

export const SortedOutlines: React.FC<{
  items: Item[];
  selectedItem: number | null;
  changeItem: (itemId: number, updater: (item: Item) => Item) => void;
  setSelectedItem: React.Dispatch<React.SetStateAction<number | null>>;
  setGuides: React.Dispatch<React.SetStateAction<{ x: number | null; y: number | null }>>;
}> = ({ items, selectedItem, changeItem, setSelectedItem, setGuides }) => {
  const itemsToDisplay = React.useMemo(() => {
    const unselected = items.filter((i) => i.id !== selectedItem);
    const selected = items.filter((i) => i.id === selectedItem);
    return [...unselected, ...selected]; // Xếp phần tử được chọn xuống cuối mảng để render sau cùng (nằm trên cùng)
  }, [items, selectedItem]);

  const isDragging = React.useMemo(() => items.some((i) => i.isDragging), [items]);

  return itemsToDisplay.map((item) => (
    <Sequence key={item.id} from={item.from} durationInFrames={item.durationInFrames} layout="none">
      <SelectionOutline
        changeItem={changeItem}
        item={item}
        setSelectedItem={setSelectedItem}
        selectedItem={selectedItem}
        isDragging={isDragging}
        setGuides={setGuides}
      />
    </Sequence>
  ));
};