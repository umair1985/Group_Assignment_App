CREATE OR REPLACE PROCEDURE create_branch_sp (
    v_branchno IN dh_branch.staffno%TYPE,
    v_street IN dh_branch.street%TYPE DEFAULT NULL,
    v_city IN dh_branch.city%TYPE DEFAULT NULL,
    v_postcode IN dh_branch.postcode%TYPE DEFAULT NULL)
IS
BEGIN
   
    INSERT INTO dh_branch (branchno, street, city, postcode) VALUES 
    (v_branchno, v_street, v_city, v_postcode);
    COMMIT;
END;