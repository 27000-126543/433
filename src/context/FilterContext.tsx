import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ShiftType = 'all' | 'day' | 'night';

interface FilterState {
  selectedShift: ShiftType;
  selectedDate: string;
}

interface FilterContextType extends FilterState {
  setSelectedShift: (shift: ShiftType) => void;
  setSelectedDate: (date: string) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedShift, setSelectedShift] = useState<ShiftType>('all');
  const [selectedDate, setSelectedDate] = useState('');

  const resetFilters = () => {
    setSelectedShift('all');
    setSelectedDate('');
  };

  return (
    <FilterContext.Provider
      value={{
        selectedShift,
        selectedDate,
        setSelectedShift,
        setSelectedDate,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};

export const isInShift = (timeString: string, shift: ShiftType): boolean => {
  if (shift === 'all') return true;
  const hour = parseInt(timeString.split('T')[1]?.split(':')[0] || '0', 10);
  if (shift === 'day') {
    return hour >= 8 && hour < 20;
  } else {
    return hour >= 20 || hour < 8;
  }
};

export const isOnDate = (timeString: string, date: string): boolean => {
  if (!date) return true;
  return timeString.startsWith(date);
};

export const matchFilter = (timeString: string, shift: ShiftType, date: string): boolean => {
  return isInShift(timeString, shift) && isOnDate(timeString, date);
};
