import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TripItinerary } from '@/app/types/tripPlanning';

/**
 * Export itinerary to PDF using HTML rendering for better text preservation
 */
export async function exportToPDF(trip: TripItinerary, filename: string = 'itinerary'): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create HTML content
      const startDate = trip.startDate instanceof Date ? trip.startDate.toLocaleDateString() : new Date(trip.startDate).toLocaleDateString();
      const endDate = trip.endDate instanceof Date ? trip.endDate.toLocaleDateString() : new Date(trip.endDate).toLocaleDateString();

      let htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: white; width: 100%; max-width: 800px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2c638b 0%, #1e4d6a 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">${trip.tripName}</h1>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">
              ${startDate} - ${endDate} | ${trip.totalDays} Days${trip.totalDistance ? ` | ${trip.totalDistance} km` : ''}
            </p>
          </div>

          <!-- Trip Items -->
          <div style="space-y: 20px;">
      `;

      // Add items
      trip.items.forEach((item) => {
        htmlContent += `
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #f9f9f9;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <div>
                <h3 style="margin: 0; color: #2c638b; font-size: 16px; font-weight: bold;">Day ${item.day} - ${item.time}</h3>
                <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: #000;">${item.placeName}</p>
              </div>
            </div>
            
            <p style="margin: 8px 0; font-size: 12px; color: #666;">
              📍 ${item.address}
            </p>
            
            <p style="margin: 8px 0; font-size: 12px; color: #333;">
              ⏱️ Duration: ${item.duration}h${item.estimatedTravelTime ? ` | 🚗 Travel: ${item.estimatedTravelTime}min` : ''}
            </p>
            
            <p style="margin: 10px 0; font-size: 13px; color: #333; line-height: 1.5;">
              ${item.description}
            </p>
            
            ${item.notes ? `
              <p style="margin: 10px 0 0 0; padding: 8px; background: #e3f2fd; border-left: 3px solid #2c638b; font-size: 12px; color: #1565c0; font-style: italic;">
                💡 ${item.notes}
              </p>
            ` : ''}
          </div>
        `;
      });

      htmlContent += `
          </div>
        </div>
      `;

      // Create temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '800px';
      document.body.appendChild(container);

      // Render to canvas with proper settings
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Remove temporary container
      document.body.removeChild(container);

      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Calculate dimensions to fit on page
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPosition = 5;
      let remainingHeight = imgHeight;

      // Handle multi-page
      while (remainingHeight > 0) {
        const canDrawHeight = pageHeight - 10;
        const drawHeight = Math.min(remainingHeight, canDrawHeight);
        
        const sourceY = (imgHeight - remainingHeight) * (canvas.height / imgHeight);
        const cutCanvas = document.createElement('canvas');
        cutCanvas.width = canvas.width;
        cutCanvas.height = (drawHeight * canvas.height) / imgHeight;

        const ctx = cutCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, -sourceY, canvas.width, canvas.height);
          const cutImgData = cutCanvas.toDataURL('image/png');
          pdf.addImage(cutImgData, 'PNG', 5, yPosition, imgWidth, drawHeight);
        }

        remainingHeight -= drawHeight;
        yPosition = 5;

        if (remainingHeight > 0) {
          pdf.addPage();
        }
      }

      // Save PDF
      pdf.save(`${filename}.pdf`);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Export itinerary to PNG image
 */
export async function exportToImage(trip: TripItinerary, filename: string = 'itinerary'): Promise<void> {
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = 'white';
  container.style.fontFamily = "'Poppins', sans-serif";
  container.style.padding = '40px';

  // Build HTML content
  const startDate = trip.startDate instanceof Date ? trip.startDate.toLocaleDateString() : new Date(trip.startDate).toLocaleDateString();
  const endDate = trip.endDate instanceof Date ? trip.endDate.toLocaleDateString() : new Date(trip.endDate).toLocaleDateString();

  let html = `
    <div style="background: linear-gradient(135deg, #2c638b, #1e4d6a); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
      <h1 style="margin: 0; font-size: 32px; font-weight: bold;">${trip.tripName}</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
        ${startDate} - ${endDate} | ${trip.totalDays} Days${trip.totalDistance ? ` | ${trip.totalDistance} km` : ''}
      </p>
    </div>
  `;

  // Add itinerary items
  trip.items.forEach((item, index) => {
    const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
    html += `
      <div style="background: ${bgColor}; padding: 20px; margin-bottom: 20px; border-left: 4px solid #2c638b; border-radius: 5px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <div>
            <p style="margin: 0; font-size: 12px; color: #2c638b; font-weight: bold;">DAY ${item.day} • ${item.time}</p>
            <h3 style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold; color: #1a1a1a;">${item.placeName}</h3>
          </div>
        </div>
        <p style="margin: 6px 0; font-size: 12px; color: #666;">📍 ${item.address}</p>
        <p style="margin: 8px 0; font-size: 12px; color: #666;">
          ⏱️ Duration: ${item.duration}h${item.estimatedTravelTime ? ` | 🚗 Travel: ${item.estimatedTravelTime}min` : ''}
        </p>
        <p style="margin: 8px 0; font-size: 13px; color: #333; line-height: 1.5;">${item.description}</p>
        ${item.notes ? `<p style="margin: 8px 0; font-size: 12px; color: #666; font-style: italic; border-left: 2px solid #2c638b; padding-left: 10px;">💡 ${item.notes}</p>` : ''}
      </div>
    `;
  });

  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${filename}-${Date.now()}.png`;
    link.click();
  } catch (error) {
    throw new Error('Failed to generate image from itinerary');
  } finally {
    document.body.removeChild(container);
  }
}
