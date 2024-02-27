import React from 'react';
import { BiPlus, BiMinus } from 'react-icons/bi';

const Counter = ({ label, count, onIncrement, onDecrement }) => (
  <div className='flex items-center justify-between my-2'>
    <BiMinus onClick={onDecrement} className='cursor-pointer text-3xl border border-black  rounded-full' />
    <span className='text-xl'>{label}: {count}</span>
    <BiPlus onClick={onIncrement} className='cursor-pointer text-3xl border border-black  rounded-full' />
  </div>
);

export default Counter;
