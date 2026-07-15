import React from 'react';
import { CheckCircle2, Circle, AlertTriangle, ArrowRight, ArrowDown } from 'lucide-react';

interface BookingTimelineProps {
  bookingStatus: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'confirmed';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
}

export const BookingTimeline: React.FC<BookingTimelineProps> = ({
  bookingStatus,
  paymentStatus,
}) => {
  const isCancelled = bookingStatus === 'cancelled';
  const isRefunded = paymentStatus === 'refunded';

  // progression steps definition
  const steps = [
    {
      id: 1,
      title: 'Booking Created',
      desc: 'Reservation requested in workspace',
      isCompleted: true, // Always true if booking exists
      isActive: false,
    },
    {
      id: 2,
      title: 'Payment Received',
      desc: 'Financial settlement verified',
      isCompleted: paymentStatus === 'paid',
      isActive: paymentStatus !== 'paid' && !isCancelled,
    },
    {
      id: 3,
      title: 'Vendor Accepted',
      desc: 'Bespoke partner availability confirmed',
      isCompleted: ['accepted', 'confirmed', 'in_progress', 'completed'].includes(bookingStatus),
      isActive: bookingStatus === 'pending' && paymentStatus === 'paid' && !isCancelled,
    },
    {
      id: 4,
      title: 'Planning Started',
      desc: 'Active details curation underway',
      isCompleted: ['in_progress', 'completed'].includes(bookingStatus),
      isActive: ['accepted', 'confirmed'].includes(bookingStatus) && !isCancelled,
    },
    {
      id: 5,
      title: 'Celebration Completed',
      desc: 'Birthday orchestrations executed',
      isCompleted: bookingStatus === 'completed',
      isActive: bookingStatus === 'in_progress' && !isCancelled,
    },
  ];

  if (isCancelled) {
    return (
      <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-5 flex items-start space-x-3.5">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm text-red-400 font-display">Reservation Cancelled</h4>
          <p className="text-xs text-neutral-400 leading-relaxed mt-1 font-light">
            This booking has been cancelled and is no longer active. {isRefunded ? 'All processed funds have been successfully refunded to the original payment source.' : 'If payment was settled, a coordinator will verify refund eligibility.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop view (horizontal steps) */}
      <div className="hidden md:flex items-center justify-between w-full relative pt-2">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1 text-center relative group">
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-5 left-[50%] right-[-50%] h-0.5 z-0 transition-colors duration-500 ${
                    steps[idx + 1].isCompleted
                      ? 'bg-gradient-to-r from-[#6C4CF1] to-[#6C4CF1]'
                      : 'bg-neutral-800'
                  }`}
                />
              )}

              {/* Step indicator node */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step.isCompleted
                      ? 'bg-[#6C4CF1]/10 text-[#B4A2FF] border-2 border-[#6C4CF1]'
                      : step.isActive
                      ? 'bg-amber-500/10 text-amber-400 border-2 border-amber-500 animate-pulse'
                      : 'bg-neutral-900 text-neutral-600 border border-neutral-800'
                  }`}
                >
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#B4A2FF]" />
                  ) : (
                    <span className="text-xs font-mono font-bold">{step.id}</span>
                  )}
                </div>

                <div className="mt-3.5 space-y-1 px-2">
                  <h5
                    className={`font-display text-xs font-semibold ${
                      step.isCompleted
                        ? 'text-neutral-200'
                        : step.isActive
                        ? 'text-amber-400'
                        : 'text-neutral-500'
                    }`}
                  >
                    {step.title}
                  </h5>
                  <p className="text-[10px] text-neutral-500 max-w-[120px] mx-auto font-light leading-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Mobile view (vertical stack) */}
      <div className="flex md:hidden flex-col space-y-4">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-start space-x-3.5 relative">
            {/* vertical connector */}
            {idx < steps.length - 1 && (
              <div
                className={`absolute top-9 left-4.5 bottom-[-16px] w-0.5 z-0 transition-colors duration-500 ${
                  steps[idx + 1].isCompleted ? 'bg-[#6C4CF1]' : 'bg-neutral-800'
                }`}
              />
            )}

            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 relative transition-all duration-300 ${
                step.isCompleted
                  ? 'bg-[#6C4CF1]/10 text-[#B4A2FF] border-2 border-[#6C4CF1]'
                  : step.isActive
                  ? 'bg-amber-500/10 text-amber-400 border-2 border-amber-500 animate-pulse'
                  : 'bg-neutral-900 text-neutral-600 border border-neutral-800'
              }`}
            >
              {step.isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-[#B4A2FF]" />
              ) : (
                <span className="text-xs font-mono font-bold">{step.id}</span>
              )}
            </div>

            <div className="space-y-0.5 pt-1">
              <h5
                className={`font-display text-xs font-semibold ${
                  step.isCompleted
                    ? 'text-neutral-200'
                    : step.isActive
                    ? 'text-amber-400'
                    : 'text-neutral-400'
                }`}
              >
                {step.title}
              </h5>
              <p className="text-[10px] text-neutral-500 font-light">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
