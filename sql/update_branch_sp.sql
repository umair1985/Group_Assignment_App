CREATE OR REPLACE PROCEDURE update_branch_sp (
    v_branchno IN dh_branch.BRANCHNO%TYPE,
    v_street IN dh_branch.street%TYPE DEFAULT NULL,
    v_city IN dh_branch.city%TYPE DEFAULT NULL,
    v_postcode IN dh_branch.postcode%TYPE DEFAULT NULL
) IS
BEGIN
    UPDATE dh_branch SET 
        street = CASE WHEN v_street IS NOT NULL THEN v_street ELSE street END,
        city = CASE WHEN v_city IS NOT NULL THEN v_city ELSE city END,
        postcode = CASE WHEN v_postcode IS NOT NULL THEN v_postcode ELSE postcode END
    WHERE BRANCHNO = v_branchno;
    COMMIT;
END;