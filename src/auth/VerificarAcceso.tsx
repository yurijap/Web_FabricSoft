import { Navigate } from 'react-router-dom';
import { ProtectorRoles } from './ProtecteRoles';

export function VerificarAcceso() {
  return <ProtectorRoles rolesPermitidos={['admin', 'superadmin']}><Navigate to="/admin" replace /></ProtectorRoles>;
}
