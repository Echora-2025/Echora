import { useEffect } from 'react';
import { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
import { useMediaDeviceSelect, useMaybeRoomContext } from '@livekit/components-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, type Option } from '../ui/select';
import { cn } from '@/lib/utils';

type DeviceSelectProps = React.ComponentProps<typeof SelectTrigger> & {
  kind: MediaDeviceKind;
  track?: LocalAudioTrack | LocalVideoTrack;
  requestPermissions?: boolean;
  onError?: (error: Error) => void;
  initialSelection?: string;
  onActiveDeviceChange?: (deviceId: string) => void;
  onDeviceListChange?: (devices: MediaDeviceInfo[]) => void;
};

export function DeviceSelect({
  kind,
  track,
  requestPermissions,
  onError,
  initialSelection,
  onActiveDeviceChange,
  onDeviceListChange,
  className,
  ...props
}: DeviceSelectProps) {
  const room = useMaybeRoomContext();
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({
    kind,
    room,
    track,
    requestPermissions,
    onError,
  });

  useEffect(() => {
    onDeviceListChange?.(devices);
  }, [devices, onDeviceListChange]);

  useEffect(() => {
    if (initialSelection && devices.some((device) => device.deviceId === initialSelection)) {
      setActiveMediaDevice(initialSelection);
    }
  }, [devices, initialSelection, setActiveMediaDevice]);

  const handleValueChange = (option: Option) => {
    const deviceId = option?.value ?? '';
    setActiveMediaDevice(deviceId);
    onActiveDeviceChange?.(deviceId);
  };

  if (devices.length === 0) {
    return null;
  }

  const deviceOptions = devices.map((device, index) => ({
    value: device.deviceId,
    label: device.label || `Device ${index + 1}`,
  }));

  const selectedOption: Option = deviceOptions.find((option) => option.value === activeDeviceId) ?? undefined;

  return (
    <Select value={selectedOption} onValueChange={handleValueChange}>
      <SelectTrigger className={cn('min-w-[160px]', className)} {...props}>
        <SelectValue placeholder={`Select ${kind}`} />
      </SelectTrigger>
      <SelectContent>
        {deviceOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            label={option.label}
            className="text-xs"
          />
        ))}
      </SelectContent>
    </Select>
  );
}
