import { useState } from 'react';
import { X } from 'lucide-react';
import { ItineraryItem } from '@/app/types/tripPlanning';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface EditItineraryModalProps {
  item: ItineraryItem;
  onSave: (updatedItem: ItineraryItem) => void;
  onClose: () => void;
}

export default function EditItineraryModal({
  item,
  onSave,
  onClose,
}: EditItineraryModalProps) {
  const [time, setTime] = useState(item.time);
  const [duration, setDuration] = useState(item.duration);
  const [description, setDescription] = useState(item.description);
  const [notes, setNotes] = useState(item.notes || '');

  const handleSave = () => {
    const updatedItem: ItineraryItem = {
      ...item,
      time,
      duration: parseFloat(duration.toString()),
      description,
      notes,
    };
    onSave(updatedItem);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-['Poppins',sans-serif] font-semibold text-[20px] text-black">
            Edit Activity
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* Place Name (Read-only) */}
          <div>
            <label className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black block mb-2">
              Place
            </label>
            <div className="px-3 py-2 bg-gray-100 rounded-lg font-['Poppins',sans-serif] text-[14px] text-gray-700">
              {item.placeName}
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black block mb-2">
              Start Time
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black block mb-2">
              Duration (hours)
            </label>
            <Input
              type="number"
              min="0.5"
              max="12"
              step="0.5"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black block mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-['Poppins',sans-serif] text-[14px] min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-[#2c638b]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black block mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or tips..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-['Poppins',sans-serif] text-[14px] min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-[#2c638b]"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-[#2c638b] hover:bg-[#234d6a] text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
