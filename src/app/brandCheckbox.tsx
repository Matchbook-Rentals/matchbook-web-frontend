import React from 'react';
import styles from './brandCheckbox.module.css';

export interface BrandCheckboxProps {
  /** If `true`, React will focus the element on mount. */
  autoFocus?: boolean;
  
  /** Controls whether the input is selected. When you pass this prop, you must also pass an `onChange` handler that updates the passed value. */
  checked?: boolean;
  
  /** Specifies the initial value that a user can change. */
  defaultChecked?: boolean;
  
  /** Descriptive text that will be rendered adjacent to the control's label. */
  description?: string;
  
  /** Sets whether or not the element should be disabled. Prevents selection. */
  disabled?: boolean;
  
  /** Error text that will be rendered below the control. */
  error?: string;
  
  /** Specifies the `id` of the `<form>` this input belongs to. If omitted, it's the closest parent form. */
  form?: string;
  
  /** Visually hides the specified elements. The hidden elements will still be present and visible to screen readers. */
  hiddenElements?: ('label' | 'description' | 'error')[];
  
  /** Sets whether the `Checkbox` should be rendered as indeterminate ("partially checked") or not. */
  indeterminate?: boolean;
  
  /** Sets whether or not the element is in an invalid state. This is a display-only prop, and will not prevent form submission. */
  invalid?: boolean;
  
  /** Text that describes the control. Will be both visible and clickable. */
  label?: React.ReactNode;
  
  /** Specifies the name for this input that's submitted with the form. */
  name?: string;
  
  /** Required for controlled inputs. Fires immediately when the input's value is changed by the user. */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  
  /** If `true`, the input is not editable by the user. */
  readOnly?: boolean;
  
  /** If `true`, the value must be provided for the form to submit. */
  required?: boolean;
  
  /** Overrides the default tab key behavior. Avoid using values other than `-1` and `0`. */
  tabIndex?: number;
  
  /** Controls the input's text. When you pass this prop, you must also pass an `onChange` handler that updates the passed value. */
  value?: string;
}

export const BrandCheckbox: React.FC<BrandCheckboxProps> = ({
  autoFocus,
  checked,
  defaultChecked,
  description,
  disabled,
  error,
  form,
  hiddenElements = [],
  indeterminate,
  invalid,
  label,
  name,
  onChange,
  readOnly,
  required,
  tabIndex,
  value,
}) => {
  const checkboxRef = React.useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
    if (checkboxRef.current && indeterminate !== undefined) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);
  
  const showLabel = !hiddenElements.includes('label');
  const showDescription = !hiddenElements.includes('description');
  const showError = !hiddenElements.includes('error');
  
  return (
    <div className={styles['brand-checkbox-container']}>
      <div className={styles['brand-checkbox-wrapper']}>
        <input
          ref={checkboxRef}
          type="checkbox"
          id={name}
          autoFocus={autoFocus}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          form={form}
          name={name}
          onChange={onChange}
          readOnly={readOnly}
          required={required}
          tabIndex={tabIndex}
          value={value}
          className={`${styles['brand-checkbox-input']} ${invalid ? styles['invalid'] : ''}`}
          aria-invalid={invalid}
          aria-describedby={
            [
              description && showDescription ? 'checkbox-description' : null,
              error && showError ? 'checkbox-error' : null,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
        />
        {label && showLabel && (
          <label className={styles['brand-checkbox-label']} htmlFor={name}>
            {label}
          </label>
        )}
      </div>
      
      {description && showDescription && (
        <p id="checkbox-description" className={styles['brand-checkbox-description']}>
          {description}
        </p>
      )}
      
      {error && showError && (
        <p id="checkbox-error" className={styles['brand-checkbox-error']} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default BrandCheckbox;