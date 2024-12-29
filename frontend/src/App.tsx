import React, { useState } from 'react';
import {
  Container,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TablePagination,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import Papa from 'papaparse';

interface CSVData {
  [key: string]: string;
}

const baseUrl = "http://localhost:5000";

const App: React.FC = () => {
  const [csvData, setCsvData] = useState<CSVData[]>([]);
  const [filteredData, setFilteredData] = useState<CSVData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<{ [key: string]: string }>({});
  const [userRole, setUserRole] = React.useState<'retailers' | 'suppliers'>('retailers');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse<CSVData>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length) {
            console.error('Error parsing CSV:', result.errors);
            return;
          }
          setHeaders(result.meta.fields || []);
          setCsvData(result.data);
          setFilteredData(result.data);
          const initialFilters: { [key: string]: string } = {};
          (result.meta.fields || []).forEach((field) => {
            initialFilters[field] = '';
          });
          setFilterValues(initialFilters);
        },
      });
    }
  };

  const handleFilterChange = (header: string) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }> | SelectChangeEvent<string>
  ) => {
    const value = (event.target as HTMLInputElement).value || (event as SelectChangeEvent<string>).target.value;
    const newFilterValues = { ...filterValues, [header]: value };
    setFilterValues(newFilterValues);
  
    setFilteredData(
      csvData.filter((row) =>
        headers.every((h) =>
          newFilterValues[h]
            ? row[h]?.toLowerCase().includes(newFilterValues[h].toLowerCase())
            : true
        )
      )
    );
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getUniqueValues = (header: string) => {
    return Array.from(new Set(csvData.map((row) => row[header] || '')));
  };
  
  const handleSave = () => {
    const dataToSave = { csvData, filterValues };
  
    fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
    })
      .then((response) => {
        if (response.ok) {
          alert('Data saved successfully!');
        } else {
          alert('Failed to save data.');
        }
      })
      .catch((error) => console.error('Error saving data:', error));
  };

  const handleLoad = () => 
  {
    fetch(baseUrl)
    .then((response) => response.json())
    .then((data: { csvData: CSVData[]; filterValues: { [key: string]: string } }) => 
    {
      if (data && Array.isArray(data.csvData) && data.csvData.length > 0) 
      {
        const headers = Object.keys(data.csvData[0]);
        setHeaders(headers);
        setCsvData(data.csvData);
        setFilteredData(data.csvData);
        setFilterValues(data.filterValues || {}); 

        const filtered = data.csvData.filter((row) =>
          headers.every((header) =>
            data.filterValues[header]
              ? row[header]?.toLowerCase().includes(data.filterValues[header].toLowerCase())
              : true
          )
        );
        setFilteredData(filtered);

      } 
      else 
      {
        console.warn('No data found or invalid format:', data);
        setCsvData([]);
        setFilteredData([]);
        setHeaders([]);
        setFilterValues({});
      }
    })
    .catch((error) => console.error('Error loading data:', error));
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Bazaar.ai: Top deals on Amazon
      </Typography>
      <span style={{ marginBottom: '16px' , marginRight: '16px'}}>
        <Select
          value={userRole}
          onChange={(e) => setUserRole(e.target.value as 'retailers' | 'suppliers')}
          displayEmpty
        >
          <MenuItem value="retailers">Retailers</MenuItem>
          <MenuItem value="suppliers">Suppliers</MenuItem>
        </Select>
      </span>

      <Button
        variant="contained"
        color="primary"
        style={{ marginBottom: '6px', marginRight: '10px' }}
        onClick={handleSave}
      >
        Save
      </Button>
      <Button
        variant="contained"
        color="secondary"
        style={{ marginBottom: '6px' }}
        onClick={handleLoad}
      >
        Load
      </Button>

      {userRole === 'suppliers' && ( 
        <Button
        variant="contained"
        component="label"
        style={{  marginBottom: '6px', marginLeft: '10px' }}
      >
        Upload CSV File
        <input
          type="file"
          accept=".csv"
          hidden
          onChange={handleFileUpload}
        />
      </Button>
      )}

      {csvData.length > 0 && (
        <>
          <Paper style={{ padding: '20px', marginBottom: '20px' }}>
            {headers.map((header) => {
              const uniqueValues = getUniqueValues(header);
              return (
                <FormControl key={header} style={{ marginRight: '10px', marginBottom: '10px' }}>
                  {uniqueValues.length <= 10 ? (
                    <>
                      <InputLabel>Filter by {header}</InputLabel>
                      <Select
                        value={filterValues[header] || ''}
                        onChange={handleFilterChange(header)}
                      >
                        <MenuItem value="">None</MenuItem>
                        {uniqueValues.map((value) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        ))}
                      </Select>
                    </>
                  ) : (
                    <TextField
                      label={`Filter by ${header}`}
                      value={filterValues[header] || ''}
                      onChange={handleFilterChange(header)}
                    />
                  )}
                </FormControl>
              );
            })}
          </Paper>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableCell key={header}>{header}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((header) => (
                        <TableCell key={header}>{row[header]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 50, 100]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </>
      )}
    </Container>
  );
};

export default App;