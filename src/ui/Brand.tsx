import { Link } from 'react-router-dom';
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link to="/" className={`brand ${small ? 'brand-small' : ''}`} aria-label="Transform home">
      transform<span className="brand-dot">.</span>
    </Link>
  );
}
