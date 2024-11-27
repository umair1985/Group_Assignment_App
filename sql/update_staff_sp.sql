CREATE OR REPLACE PROCEDURE update_staff_sp (
    v_staffno IN dh_staff.staffno%TYPE,
    v_email IN dh_staff.email%TYPE DEFAULT NULL,
    v_salary IN dh_staff.salary%TYPE DEFAULT NULL,
    v_telephone IN dh_staff.telephone%TYPE DEFAULT NULL
) IS
BEGIN
    UPDATE dh_staff SET 
        EMAIL = CASE WHEN v_email IS NOT NULL THEN v_email ELSE EMAIL END,
        SALARY = CASE WHEN v_salary IS NOT NULL THEN v_salary ELSE SALARY END,
        TELEPHONE = CASE WHEN v_telephone IS NOT NULL THEN v_telephone ELSE TELEPHONE END
    WHERE STAFFNO = v_staffno;
    COMMIT;
END;