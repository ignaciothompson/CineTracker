import { DetailContent, type DetailContentProps } from './DetailContent';
import './DetailScreen.css';

type DetailScreenProps = Omit<DetailContentProps, 'variant'>;

export function DetailScreen(props: DetailScreenProps) {
  return (
    <div className="detail-screen" role="dialog" aria-modal="true">
      <header className="detail-screen-topbar">
        <button type="button" className="detail-back-btn" onClick={props.onClose}>
          ← Volver
        </button>
        <span className="detail-screen-title">{props.item.title}</span>
      </header>
      <div className="detail-screen-scroll">
        <DetailContent {...props} variant="screen" />
      </div>
    </div>
  );
}
