import { Badge } from "@/components/ui/badge";

interface VehicleDetailFieldProps {
  label: string;
  value: string | number | null;
  isHighPriority?: boolean;
}

export function VehicleDetailField({
  label,
  value,
  isHighPriority = false
}: VehicleDetailFieldProps) {
  const isNotDetected = value == null;

  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {isHighPriority && <span className="ml-1 text-red-600" title="High priority for fraud detection">*</span>}
      </span>
      {isNotDetected ? (
        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
          Not detected
        </Badge>
      ) : (
        <span className="text-sm text-gray-900 font-medium">{value}</span>
      )}
    </div>
  );
}
