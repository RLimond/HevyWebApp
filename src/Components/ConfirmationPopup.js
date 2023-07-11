export default function ConfirmationPopup({ onConfirm, onCancel, confirmLeft = true}) {
    return (
      <>
      {  (confirmLeft === true) ? (
      <div className="confirmation-popup">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div> ) :  (
      <div className="confirmation-popup">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div> )
      }
      </>
    );
  }