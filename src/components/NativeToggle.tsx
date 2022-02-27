import { useNativeValues } from '../contexts/nativeValues';

export function NativeToggle() {
  const { nativeValues, toggleNativeValues } = useNativeValues();

  return (
    <div
      className={`native-toggle flex align-center justify-start ${nativeValues ? 'active justify-end' : ''}`}
      onClick={() => toggleNativeValues()}>
      <div className={`crypto flex-centered ${nativeValues ? 'active' : ''}`}>
        <i className="jet-icons">❍</i>
      </div>
      <div className={`usd flex-centered ${!nativeValues ? 'active' : ''}`}>
        <i className="jet-icons">❏</i>
      </div>
    </div>
  );
}
