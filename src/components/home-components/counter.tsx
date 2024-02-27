import React from 'react';
import { BiPlus, BiMinus } from 'react-icons/bi';

const Counter = ({ label, count, onIncrement, onDecrement, hasBorder }) => (
  <div className={`flex items-center justify-between p-5 my-2 ${hasBorder ? 'border-b-2' : ''}`}>
    <span className='text-2xl'>{label}</span>
    <div className='flex gap-6 items-center'>
      <BiMinus onClick={onDecrement} className='cursor-pointer text-3xl border border-black rounded-full' />
      <span className='text-2xl'>{count}</span>
      <BiPlus onClick={onIncrement} className='cursor-pointer text-3xl border border-black rounded-full' />
    </div>
  </div>
);

export default Counter;
