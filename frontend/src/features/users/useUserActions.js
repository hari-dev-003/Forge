import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateUser, deleteUser } from './usersSlice.js';
import { pushToast } from '../ui/uiSlice.js';

/**
 * Activate / deactivate / delete actions for a person row.
 *
 * Shared by the managers list and a manager's team page so the delete
 * confirmation — and the rule that deletion is only offered for an already
 * deactivated account — is written once rather than drifting between them.
 */
export function useUserActions() {
  const dispatch = useDispatch();
  const [deletingId, setDeletingId] = useState(null);

  const toggleActive = async (u) => {
    const res = await dispatch(updateUser({ id: u.id, patch: { active: !u.active } }));
    dispatch(
      pushToast(
        res.meta.requestStatus === 'fulfilled'
          ? { message: `${u.name} ${u.active ? 'deactivated' : 'activated'}`, type: 'success' }
          : { message: res.payload || 'Failed to update', type: 'error' }
      )
    );
  };

  // Wipes the Cognito sign-in as well as the profile, so it is deliberately a
  // two-step action: deactivate first, then confirm.
  const removeUser = async (u) => {
    const confirmed = window.confirm(
      `Permanently delete ${u.name} (${u.email})?\n\n` +
        `This removes their Cognito sign-in and their profile. It cannot be undone. ` +
        `Their past meetings and points history are kept for reporting.`
    );
    if (!confirmed) return;

    setDeletingId(u.id);
    const res = await dispatch(deleteUser(u.id));
    setDeletingId(null);
    dispatch(
      pushToast(
        res.meta.requestStatus === 'fulfilled'
          ? { message: `${u.name} deleted`, type: 'success' }
          : { message: res.payload || 'Failed to delete', type: 'error' }
      )
    );
  };

  return { toggleActive, removeUser, deletingId };
}

export default useUserActions;
