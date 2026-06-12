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

const parseHour = (timeString: string): number => {
  if (!timeString) return 0;
  
  if (timeString.includes('T')) {
    const timePart = timeString.split('T')[1];
    return parseInt(timePart?.split(':')[0] || '0', 10);
  }
  
  if (timeString.includes(' ')) {
    const timePart = timeString.split(' ')[1];
    return parseInt(timePart?.split(':')[0] || '0', 10);
  }
  
  if (/^\d{2}:\d{2}/.test(timeString)) {
    return parseInt(timeString.split(':')[0] || '0', 10);
  }
  
  return 0;
};

const parseDate = (timeString: string): string => {
  if (!timeString) return '';
  
  if (timeString.includes('T')) {
    return timeString.split('T')[0];
  }
  
  if (timeString.includes(' ')) {
    return timeString.split(' ')[0];
  }
  
  if (/^\d{4}-\d{2}-\d{2}/.test(timeString)) {
    return timeString.slice(0, 10);
  }
  
  return '';
};

export const isInShift = (timeString: string, shift: ShiftType): boolean => {
  if (shift === 'all') return true;
  const hour = parseHour(timeString);
  if (shift === 'day') {
    return hour >= 8 && hour < 20;
  } else {
    return hour >= 20 || hour < 8;
  }
};

export const isOnDate = (timeString: string, date: string): boolean => {
  if (!date) return true;
  const parsedDate = parseDate(timeString);
  return parsedDate === date;
};

export const matchFilter = (timeString: string, shift: ShiftType, date: string): boolean => {
  return isInShift(timeString, shift) && isOnDate(timeString, date);
};
