import React from 'react';
import logoCont from '../../assets/static/logoCont.png'; // replace with actual image file

export default function InfoCard() {
  return (
    <div className="flex mt-3 items-start bg-secondary text-white p-4 rounded-xl max-w-xl shadow-md gap-4">
      {/* Left Image */}
      <img
        src={logoCont}
        alt="WX Logo"
        className="w-20 h-20 rounded-lg object-cover"
      />

      {/* Right Text */}
      <div>
        <h2 className="!text-[20px] font-semibold text-gray-300 mb-1">
          Get Started in Seconds
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Whether you are a beginner or an
expert, you can easily get started
without any professional knowledge
        </p>
      </div>
    </div>
  );
}
