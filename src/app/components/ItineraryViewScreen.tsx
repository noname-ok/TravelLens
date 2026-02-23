import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Trash2, Download, Image as ImageIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { TripItinerary, ItineraryItem } from '@/app/types/tripPlanning';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { exportToImage, exportToPDF } from '@/app/utils/exportUtils';
import EditItineraryModal from './EditItineraryModal';

interface ItineraryViewScreenProps {
  trip: TripItinerary;
  onBack: () => void;
  onDelete: (tripId: string) => void;
  onUpdate: (trip: TripItinerary) => void;
  onReplan?: () => void;
}

export default function ItineraryViewScreen({
  trip,
  onBack,
  onDelete,
  onUpdate,
  onReplan,
}: ItineraryViewScreenProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [tripName, setTripName] = useState(trip.tripName);
  const [isEditing, setIsEditing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const toggleDay = (day: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };

  const handleSaveName = () => {
    if (tripName.trim()) {
      const updatedTrip = { ...trip, tripName };
      onUpdate(updatedTrip);
      setIsEditing(false);
      toast.success('Trip name updated');
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = trip.items.filter((item) => item.id !== itemId);
    const updatedTrip = { ...trip, items: updatedItems, updatedAt: new Date() };
    onUpdate(updatedTrip);
    toast.success('Item removed from itinerary');
  };

  const handleEditItem = (item: ItineraryItem, updatedItem: ItineraryItem) => {
    const updatedItems = trip.items.map((i) => (i.id === item.id ? updatedItem : i));
    const updatedTrip = { ...trip, items: updatedItems, updatedAt: new Date() };
    onUpdate(updatedTrip);
    setEditingItem(null);
    toast.success('Item updated');
  };

  const handleExportImage = async () => {
    setExporting(true);
    try {
      await exportToImage(trip, 'itinerary');
      toast.success('Itinerary exported as image');
    } catch (error) {
      toast.error('Failed to export as image');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportToPDF(trip, 'itinerary');
      toast.success('Itinerary exported as PDF');
    } catch (error) {
      toast.error('Failed to export as PDF');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteTrip = () => {
    if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      onDelete(trip.id);
      onBack();
      toast.success('Trip deleted');
    }
  };

  const handleReplanTrip = () => {
    if (confirm('This will delete your current itinerary and create a new one. Continue?')) {
      onDelete(trip.id);
      if (onReplan) {
        onReplan();
      } else {
        onBack();
      }
      toast.success('Ready to create a new itinerary');
    }
  };

  const itemsByDay = new Map<number, ItineraryItem[]>();
  for (let day = 1; day <= trip.totalDays; day++) {
    const dayItems = trip.items.filter((item) => item.day === day);
    if (dayItems.length > 0 || day <= trip.totalDays) {
      itemsByDay.set(day, dayItems);
    }
  }

  return (
    <div className="bg-white relative size-full">
      <div className="relative mx-auto w-full max-w-[390px] h-full flex flex-col">
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white z-20 border-b border-gray-200 px-6 py-4 space-y-3">
          {/* Back and Delete */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-[#2c638b] font-['Poppins',sans-serif] font-semibold text-[14px]"
            >
              ← Back
            </button>
            <button
              onClick={handleDeleteTrip}
              className="text-red-500 hover:text-red-700 transition"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {/* Trip Title */}
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="Trip name"
                className="flex-1"
              />
              <Button onClick={handleSaveName} size="sm">
                Save
              </Button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
            >
              <h1 className="font-['Poppins',sans-serif] font-semibold text-[24px] text-black">
                {tripName}
              </h1>
            </div>
          )}

          {/* Trip Info */}
          <div className="flex items-center gap-4 text-[12px] font-['Poppins',sans-serif] text-gray-600">
            <span>📅 {trip.startDate.toLocaleDateString()}</span>
            <span>📍 {trip.totalDays} days</span>
            {trip.totalDistance && <span>🗺️ {trip.totalDistance} km</span>}
          </div>

          {/* Export and Replan Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleExportImage}
              disabled={exporting}
              size="sm"
              variant="outline"
              className="flex-1 gap-2"
            >
              <ImageIcon size={16} />
              Image
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={exporting}
              size="sm"
              variant="outline"
              className="flex-1 gap-2"
            >
              <FileText size={16} />
              PDF
            </Button>
            <Button
              onClick={handleReplanTrip}
              size="sm"
              className="flex-1 bg-[#2c638b] hover:bg-[#1e4d6a] text-white"
            >
              🔄 Replan
            </Button>
          </div>
        </div>

        {/* Itinerary Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <p className="font-['Poppins',sans-serif] text-[12px] text-gray-700 leading-relaxed">
              <span className="font-semibold text-[#2c638b]">Trip Summary:</span> {trip.totalDays}-day
              journey visiting {trip.items.length} places
            </p>
          </div>

          {/* Days and Items */}
          {Array.from(itemsByDay.entries()).map(([day, items]) => (
            <div key={day} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Day Header */}
              <button
                onClick={() => toggleDay(day)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#2c638b] to-[#1e4d6a] hover:from-[#1e4d6a] hover:to-[#152a3a] transition text-white"
              >
                <div className="text-left">
                  <p className="font-['Poppins',sans-serif] font-semibold text-[16px]">
                    Day {day}
                  </p>
                  <p className="font-['Poppins',sans-serif] text-[12px] opacity-90">
                    {items.length} activities
                  </p>
                </div>
                {expandedDays.has(day) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {/* Day Items */}
              {expandedDays.has(day) && (
                <div className="space-y-3 p-4 bg-gray-50 border-t border-gray-200">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 space-y-2"
                    >
                      {/* Time and Place */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-['Poppins',sans-serif] font-bold text-[12px] text-[#2c638b]">
                            ⏰ {item.time}
                          </p>
                          <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black mt-1">
                            {item.placeName}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[11px] text-gray-600 mt-1">
                            📍 {item.address}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 hover:bg-blue-100 rounded-lg transition text-[#2c638b]"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Duration and Travel */}
                      <div className="flex items-center gap-4 text-[11px] font-['Poppins',sans-serif] text-gray-700">
                        <span>⏱️ {item.duration}h</span>
                        {item.estimatedTravelTime && (
                          <span>🚗 {item.estimatedTravelTime}min travel</span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="font-['Poppins',sans-serif] text-[12px] text-gray-700 bg-gray-100 p-2 rounded">
                        {item.description}
                      </p>

                      {/* Notes */}
                      {item.notes && (
                        <p className="font-['Poppins',sans-serif] text-[11px] text-gray-600 italic border-l-2 border-[#2c638b] pl-2">
                          💡 {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {trip.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-5xl mb-4">📅</div>
              <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-2">
                No itinerary items yet
              </p>
              <p className="font-['Poppins',sans-serif] text-[14px] text-gray-600">
                Start planning by adding places to your trip
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItineraryModal
          item={editingItem}
          onSave={(updatedItem) => handleEditItem(editingItem, updatedItem)}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
