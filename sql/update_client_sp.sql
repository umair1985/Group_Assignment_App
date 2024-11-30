CREATE OR REPLACE PROCEDURE update_client_sp (
    v_clientno IN dh_client.clientno%TYPE,
    v_telno IN dh_client.telno%TYPE DEFAULT NULL,
    v_street IN dh_client.street%TYPE DEFAULT NULL,
    v_city IN dh_client.city%TYPE DEFAULT NULL,
    v_email IN dh_client.email%TYPE DEFAULT NULL
) IS
BEGIN
    UPDATE dh_client SET 
        email = CASE WHEN v_email IS NOT NULL THEN v_email ELSE EMAIL END,
        city = CASE WHEN v_city IS NOT NULL THEN v_city ELSE city END,
        street = CASE WHEN v_street IS NOT NULL THEN v_street ELSE street END,
        telno = CASE WHEN v_telno IS NOT NULL THEN v_telno ELSE telno END
    WHERE clientno = v_clientno;
    COMMIT;
END;