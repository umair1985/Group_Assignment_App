const express = require("express");
const bodyParser = require("body-parser");
const oracledb = require("oracledb");
const app = express();

app.use(express.static("public"));

app.use(bodyParser.json());
app.set("view engine", "ejs");

// Database Connection Setup
const dbConfig = {
  user: "", // Replace with your Oracle DB username
  password: "", // Replace with your Oracle DB password
  connectString:
    "(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=myoracle12c.senecacollege.ca)(PORT=1521)))(CONNECT_DATA=(SERVICE_NAME=oracle12c)))",
};

// Home Page
app.get("/", (req, res) => {
  res.render("index"); // Render the homepage
});

// Staff Menu Route
app.get("/staff", (req, res) => {
  res.render("staffMenu");
});

app.get('/staffs', async (req, res) => {
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute('SELECT * FROM dh_staff');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Error fetching staff' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

////////////

// Route to render the staff update form
app.get("/update", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(`SELECT STAFFNO FROM dh_staff`);
    const staffList = result.rows.map((row) => ({ STAFFNO: row[0] }));
    res.render("updateForm", { staffList });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving staff data.");
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// POST endpoint to update staff information
app.post('/update', async (req, res) => {
  const staffs = req.body;

  try {
    for (const staff of staffs) {
      await updateStaff(staff);
    }
    res.json({ success: true, message: 'All staff updated successfully' });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.json({ success: false, message: 'Error updating staff' });
  }
});

async function updateStaff(staff) {
  const { staffNum, email, salary, telephone } = staff;
  console.log(staffNum, email, salary, telephone);
  const query = `
    BEGIN
      update_staff_sp(:v_staffno, :v_email, :v_salary, :v_telephone);
    END;
  `;

  const binds = {
    v_staffno: staffNum,
    v_email: email,
    v_salary: salary,
    v_telephone: telephone
  };
  
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log(`Updating staff: ${JSON.stringify(staff)}`);
    await connection.execute(query, binds);
    console.log(`Successfully updated staff: ${staffNum}`);
  } catch (error) {
    console.error(`Error updating staff: ${staffNum}`, error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
  
}


// API route to fetch staff details
app.get("/api/staff/:staffno", async (req, res) => {
  const { staffno } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT FNAME, LNAME FROM dh_staff WHERE STAFFNO = :staffno`,
      [staffno]
    );
    if (result.rows.length > 0) {
      const staff = {
        FNAME: result.rows[0][0],
        LNAME: result.rows[0][1],
      };
      res.json(staff);
    } else {
      res.status(404).send("Staff member not found.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving staff data.");
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Route to render the hiring form
app.get("/hire", (req, res) => {
  res.render("hireForm");
});

//POST hire
app.post('/hire', async (req, res) => {
  const { fname, lname, position, sex, branchno, dob, salary, telephone, mobile, email } = req.body;

  if (!fname || !lname || !position || !sex || !dob || !salary || !branchno || !email) {
    return res.status(400).json({ success: false, message: 'All fields are required!' });
  }

  try {
      const connection = await oracledb.getConnection(dbConfig);

      await connection.execute(
          `BEGIN staff_hire_sp(:fname, :lname, :position, :sex, TO_DATE(:dob, 'YYYY-MM-DD'), :salary, :branchno, :telephone, :mobile, :email); END;`,
          {
              fname: fname,
              lname: lname,
              position: position,
              sex: sex,
              dob: dob,
              salary: salary,
              branchno: branchno,
              telephone: telephone,
              mobile: mobile,
              email: email
          }
      );
      await connection.close();

      res.json({ success: true, message: 'New staff member hired successfully!' });
  } catch (error) {
      console.error('Error executing procedure:', error);

      res.status(500).send('Error hiring staff member.');
  }
});


// Route to render the termination form
app.get("/terminate", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(`SELECT STAFFNO FROM dh_staff`);
    const staffList = result.rows.map((row) => ({ STAFFNO: row[0] }));
    res.render("terminateForm", { staffList });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving staff data.");
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// DELETE endpoint to terminate a staff member
app.delete('/terminate/:staffno', async (req, res) => {
  const { staffno } = req.params;

  if (!staffno) {
      return res.status(400).json({ success: false, message: 'Staff number is required' });
  }

  try {
      const connection = await oracledb.getConnection(dbConfig);
      const result = await connection.execute(
          `DELETE FROM DH_STAFF WHERE STAFFNO = :staffno`,
          [staffno],
          { autoCommit: true }
      );
      await connection.close();

      if (result.rowsAffected === 0) {
          return res.status(404).json({ success: false, message: 'Staff member not found' });
      }

      res.json({ success: true, message: 'Staff member terminated successfully' });

  } catch (error) {
      console.error('Error deleting staff member:', error);
      res.status(500).json({ success: false, message: 'Error terminating staff member' });
  }
});

// API route to fetch staff details
app.get("/api/staff/:staffno", async (req, res) => {
  const { staffno } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT FNAME, LNAME FROM dh_staff WHERE STAFFNO = :staffno`,
      [staffno]
    );
    if (result.rows.length > 0) {
      const staff = {
        FNAME: result.rows[0][0],
        LNAME: result.rows[0][1],
      };
      res.json(staff);
    } else {
      res.status(404).send("Staff member not found.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving staff data.");
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Branch Menu Route
app.get("/branchMenu", (req, res) => {
  res.render("branchMenu");
});

app.get('/branches', async (req, res) => {
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute('SELECT * FROM dh_branch');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Error fetching branches' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

app.get("/createBranch", (req, res) => {
  res.render("createBranch");
});

//POST hire
app.post('/createBranch', async (req, res) => {
  const { branchno, street, city, postcode} = req.body;

  if (!branchno || !street || !city || !postcode) {
    return res.status(400).json({ success: false, message: 'All fields are required!' });
  }

  try {
      const connection = await oracledb.getConnection(dbConfig);

      await connection.execute(
          `BEGIN create_branch_sp(:branchno, :street, :city, :postcode); END;`,
          {
            branchno: branchno,
            street: street,
            city: city,
            postcode: postcode
          }
      );
      await connection.close();

      res.json({ success: true, message: 'New branch added successfully!' });
  } catch (error) {
      console.error('Error executing procedure:', error);

      // Send error response
      res.status(500).send('Error creating branch.');
  }
});

// Route to render the branch form
app.get("/branch", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(`SELECT BRANCHNO FROM dh_branch`);
    const branchList = result.rows.map((row) => ({ BRANCHNO: row[0] }));
    res.render("updateBranch", { branchList });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving branch data.");
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// API route to fetch branch details
app.get("/api/branch/:branchno", async (req, res) => {
  const { branchno } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT BRANCHNO, STREET, CITY, POSTCODE FROM dh_branch WHERE BRANCHNO = :branchno`,
      [branchno]
    );
    if (result.rows.length > 0) {
      const branch = {
        BRANCHNO: result.rows[0][0],
        STREET: result.rows[0][1],
        CITY: result.rows[0][2],
        POSTCODE: result.rows[0][3],
      };
      res.json(branch);
    } else {
      res.status(404).send("Branch not found.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving branch data.");
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

app.put('/branch/update', async (req, res) => {
  const { branchno, newStreet, newPostcode, newCity } = req.body;

  if (!branchno) {
      return res.status(400).json({ success: false, message: 'Branch number is required' });
  }

  try {
      const connection = await oracledb.getConnection(dbConfig);

      const result = await connection.execute(
          `BEGIN 
              update_branch_sp(:p_branchno, :p_street, :p_city, :p_postcode); 
          END;`,
          {
            p_branchno: branchno,
            p_city: newCity || null,
            p_street: newStreet || null,
            p_postcode: newPostcode || null
          }
      );
      await connection.close();

      res.json({ success: true, message: 'Branch information updated successfully' });

  } catch (error) {
      console.error('Error executing procedure:', error);
      res.status(500).json({ success: false, message: 'Error updating branch information' });
  }
});

// Route to Client Menu
app.get("/client", (req, res) => {
  res.render("clientMenu");
});

app.get('/clients', async (req, res) => {
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute('SELECT * FROM dh_client');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Error fetching clients' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

// Route to Register New Client Form
app.get("/newClient", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    // Fetch unique values for Preference Type dropdown
    const result = await connection.execute(
      `SELECT DISTINCT PREFTYPE FROM DH_CLIENT`
    );
    const preferences = result.rows.map((row) => row[0]); // Extract values from result
    res.render("newClient", { preferences });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error connecting to the database");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Handle form submission
app.post("/submitNewClient", async (req, res) => {
  const { clientno, fname, lname, telno, street, city, email, preftype, maxrent } = req.body;
  
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO DH_CLIENT (CLIENTNO, FNAME, LNAME, TELNO, STREET, CITY, EMAIL, PREFTYPE, MAXRENT) 
       VALUES (:clientno, :fname, :lname, :telno, :street, :city, :email, :preftype, :maxrent)`,
      { clientno, fname, lname, telno, street, city, email, preftype, maxrent },
      { autoCommit: true }
    );
    res.json({ success: true, message: "Client registered successfully!"});
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving client data");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Route to Client Update Form
app.get("/updateClient", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const clientNos = await connection.execute(
      `SELECT CLIENTNO FROM DH_CLIENT`
    );
    const clients = clientNos.rows.map((row) => row[0]);
    res.render("updateClient", { clients });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error connecting to the database");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Mock POST endpoint for adding client data to table dynamically
app.post("/addClientUpdate", async (req, res) => {
  const { clientno, telno, street, city, email } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const clientData = await connection.execute(
      `SELECT FNAME, LNAME FROM DH_CLIENT WHERE CLIENTNO = :clientno`,
      [clientno]
    );

    const name = `${clientData.rows[0][0]} ${clientData.rows[0][1]}`;
    res.json({ clientno, name, telno, street, city, email });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching client data");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Route to Client Update Form
app.get("/updateClient", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    // Fetch client numbers for dropdown
    const clientNos = await connection.execute(
      `SELECT CLIENTNO FROM DH_CLIENT`
    );
    const clients = clientNos.rows.map((row) => row[0]); // Extract values
    res.render("updateClient", { clients });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error connecting to the database");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

//API endpoint to update client details
app.put('/updateClient', async (req, res) => {
  const clients = req.body;
  console.log(clients);
  try {
    for (const client of clients) {
      await updateClient(client);
    }
    res.json({ success: true, message: 'All clients updated successfully!' });
  } catch (error) {
    console.error('Error updating clients:', error);
    res.json({ success: false, message: 'Error updating clients' });
  }
});

async function updateClient(client) {
  const { clientNo, telno, street, city, email } = client;
  console.log(clientNo, telno, street, city, email);
  const query = `
    BEGIN
      update_client_sp(:v_clientno, :v_telno, :v_street, :v_city, :v_email);
    END;
  `;

  const binds = {
    v_clientno: clientNo,
    v_telno: telno,
    v_street: street,
    v_city: city,
    v_email: email
  }
  
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log(`Updating client: ${JSON.stringify(client)}`);
    await connection.execute(query, binds);
    console.log(`Successfully updated client: ${clientNo}`);
  } catch (error) {
    console.error(`Error updating client: ${clientNo}`, error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
  
}

// Start the server
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
