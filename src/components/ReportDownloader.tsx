import React from "react";
import { useFarm } from "@/context/FarmContext";
import { Download, FileText, CheckCircle2, TableProperties } from "lucide-react";
import { showSuccess } from "@/utils/toast";

export const ReportDownloader: React.FC = () => {
  const { animals, healthRecords, treatments, inventory, contacts } = useFarm();

  const handleExcelExport = () => {
    // Generate simulated CSV file of animals and inventory
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "=== FARM ANIMALS SHEET ===\n";
    csvContent += "Animal ID,Name,Species,Breed,Sex,Date of Birth,Status,Health State\n";
    
    animals.forEach((a) => {
      csvContent += `"${a.animal_code}","${a.name || "-"}","${a.species}","${a.breed}","${a.sex}","${a.dob}","${a.status}","${a.healthStatus}"\n`;
    });

    csvContent += "\n=== FARM INVENTORY SHEET ===\n";
    csvContent += "Item,Category,Quantity,Unit,Min Stock\n";
    inventory.forEach((i) => {
      csvContent += `"${i.name}","${i.category}",${i.quantity},"${i.unit}",${i.minStock}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "farm_data_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess("Excel (CSV) data generated & downloaded!");
  };

  const handlePdfExport = () => {
    // Create printable window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showSuccess("Please allow popups to download PDF / Printable Report");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Farm Master Report</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #2d3748; padding: 24px; }
            h1 { color: #1a5f20; border-bottom: 2px solid #1a5f20; padding-bottom: 8px; }
            h2 { color: #2f855a; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background-color: #f7fafc; }
            .badge { padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .healthy { background-color: #c6f6d5; color: #22543d; }
            .sick { background-color: #fed7d7; color: #742a2a; }
          </style>
        </head>
        <body>
          <h1>🌾 Farm Master Report — V1 MVP</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Total Registered Livestock: <strong>${animals.length}</strong></p>

          <h2>🐐 Livestock Roster</h2>
          <table>
            <thead>
              <tr>
                <th>Animal ID</th>
                <th>Name</th>
                <th>Species</th>
                <th>Breed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${animals
                .map(
                  (a) => `
                <tr>
                  <td><strong>${a.animal_code}</strong></td>
                  <td>${a.name || "—"}</td>
                  <td>${a.species}</td>
                  <td>${a.breed}</td>
                  <td><span class="badge ${a.healthStatus === "Healthy" ? "healthy" : "sick"}">${a.status}</span></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <h2>📦 Active Medical Treatments</h2>
          <table>
            <thead>
              <tr>
                <th>Animal Code</th>
                <th>Condition</th>
                <th>Medication</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${treatments
                .map(
                  (t) => `
                <tr>
                  <td><strong>${animals.find((a) => a.id === t.animal_id)?.animal_code || "Unknown"}</strong></td>
                  <td>${t.condition}</td>
                  <td>${t.medication}</td>
                  <td>${t.status}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    showSuccess("Printable PDF report triggered!");
  };

  return (
    <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-600 rounded-xl text-white">
          <TableProperties size={20} />
        </div>
        <div>
          <h3 className="font-bold text-emerald-950 text-base">Farm Reports & Exports</h3>
          <p className="text-emerald-800 text-xs">Generate instant printable records for vets, owners or team logs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handlePdfExport}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold transition"
        >
          <FileText size={16} />
          Print / PDF Master Report
        </button>

        <button
          onClick={handleExcelExport}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition"
        >
          <Download size={16} />
          Export Excel Data (CSV)
        </button>
      </div>
    </div>
  );
};