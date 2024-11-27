CREATE OR REPLACE PROCEDURE staff_hire_sp (
    v_fname IN dh_staff.fname%TYPE,
    v_lname IN dh_staff.lname%TYPE,
    v_position IN dh_staff.position%TYPE,
    v_sex IN dh_staff.sex%TYPE,
    v_dob IN dh_staff.dob%TYPE,
    v_salary IN dh_staff.salary%TYPE,
    v_branchno IN dh_staff.branchno%TYPE,
    v_telephone IN dh_staff.telephone%TYPE,
    v_mobile IN dh_staff.mobile%TYPE,
    v_email IN dh_staff.email%TYPE)
IS
    v_new_staffno dh_staff.staffno%TYPE;
BEGIN
    v_new_staffno := v_branchno || UPPER(SUBSTR(v_fname, 1, 2)) || UPPER(SUBSTR(v_lname, 1, 2));
    
    INSERT INTO DH_STAFF (STAFFNO, FNAME, LNAME, POSITION, SEX, DOB, SALARY, BRANCHNO, TELEPHONE, MOBILE, EMAIL) VALUES 
    (v_new_staffno, v_fname, v_lname, v_position, v_sex, v_dob, v_salary, v_branchno,v_telephone, v_mobile, v_email);
    COMMIT;
END staff_hire_sp;